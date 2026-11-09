import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from './Card';
import { Icon } from './Icon';
import { Button } from './Button';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');

  const mockReviews: Review[] = [
    {
      id: '1',
      user_name: 'Rahul S.',
      rating: 5,
      title: 'Excellent credit card',
      comment: 'Best card for shopping. Great rewards and cashback on every purchase.',
      date: '2024-01-15',
    },
    {
      id: '2',
      user_name: 'Priya M.',
      rating: 4,
      title: 'Good card but annual fee is high',
      comment: 'Good features and benefits. The annual fee could be lower though.',
      date: '2024-01-10',
    },
    {
      id: '3',
      user_name: 'Amit K.',
      rating: 5,
      title: 'Amazing customer service',
      comment: 'The customer support is excellent. Quick resolution of issues.',
      date: '2024-01-05',
    },
  ];

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.5;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: mockReviews.filter(r => r.rating === star).length,
  }));

  const handleSubmitReview = () => {
    if (!newTitle.trim() || !newComment.trim()) {
      alert('Please fill in all fields');
      return;
    }
    const review: Review = {
      id: Date.now().toString(),
      user_name: 'You',
      rating: newRating,
      title: newTitle,
      comment: newComment,
      date: new Date().toISOString().split('T')[0],
    };
    setReviews([review, ...reviews]);
    setNewTitle('');
    setNewComment('');
    setNewRating(5);
    setShowAddReview(false);
  };

  const renderStars = (rating: number, size = 16) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            name="star"
            size={size}
            color={star <= rating ? '#FFB800' : colors.border}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Rating Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.ratingBox}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            {renderStars(Math.round(averageRating), 20)}
            <Text style={styles.totalReviews}>{mockReviews.length + reviews.length} reviews</Text>
          </View>
          <View style={styles.ratingDistribution}>
            {ratingDistribution.map(({ star, count }) => (
              <View key={star} style={styles.distRow}>
                <Text style={styles.distLabel}>{star}★</Text>
                <View style={styles.distBar}>
                  <View
                    style={[
                      styles.distFill,
                      { width: `${(count / (mockReviews.length + reviews.length)) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Add Review Button */}
      <TouchableOpacity
        style={styles.addReviewButton}
        onPress={() => setShowAddReview(!showAddReview)}
      >
        <Icon name="plus-circle" size={20} color={colors.primary} />
        <Text style={styles.addReviewText}>Write a Review</Text>
      </TouchableOpacity>

      {/* Add Review Form */}
      {showAddReview && (
        <Card style={styles.reviewFormCard}>
          <Text style={styles.formTitle}>Write Your Review</Text>
          <View style={styles.ratingSelector}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setNewRating(star)}
                style={styles.starButton}
              >
                <Icon
                  name="star"
                  size={28}
                  color={star <= newRating ? '#FFB800' : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Review Title"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholderTextColor={colors.textLight}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your review..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textLight}
          />
          <Button title="Submit Review" onPress={handleSubmitReview} />
        </Card>
      )}

      {/* Reviews List */}
      <Text style={styles.sectionTitle}>Reviews</Text>
      {[...reviews, ...mockReviews].map(review => (
        <Card key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{review.user_name[0]}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{review.user_name}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
            {renderStars(review.rating)}
          </View>
          <Text style={styles.reviewTitle}>{review.title}</Text>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  summaryCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  summaryContent: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  ratingBox: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  starContainer: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  totalReviews: {
    fontSize: 12,
    color: colors.textMid,
  },
  ratingDistribution: {
    flex: 1,
    justifyContent: 'center',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distLabel: {
    fontSize: 12,
    color: colors.textMid,
    width: 20,
  },
  distBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  distCount: {
    fontSize: 12,
    color: colors.textMid,
    width: 20,
    textAlign: 'right',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  addReviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewFormCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  starButton: {
    padding: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  reviewCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMid,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textMid,
    lineHeight: 18,
  },
});
